package com.gymmanager.updater

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.util.Log
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.gymmanager.BuildConfig
import java.io.File
import java.io.BufferedInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class AppUpdaterModule(
    private val context: ReactApplicationContext
) : ReactContextBaseJavaModule(context) {

    companion object {
        private const val TAG = "AppUpdater"
        private const val MODULE_NAME = "AppUpdater"

        private const val APK_MIME_TYPE =
            "application/vnd.android.package-archive"

        private const val FILE_PROVIDER_SUFFIX =
            ".fileprovider"
    }

    override fun getName(): String = MODULE_NAME

    // -------------------------------------------------------------------------
    // VERSION
    // -------------------------------------------------------------------------

    @ReactMethod
    fun getVersion(promise: Promise) {
        try {
            val packageInfo = context.packageManager.getPackageInfo(
                context.packageName,
                0
            )

            val versionCode =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    packageInfo.longVersionCode
                } else {
                    @Suppress("DEPRECATION")
                    packageInfo.versionCode.toLong()
                }

            val versionName = packageInfo.versionName ?: ""

            Log.d(
                TAG,
                "Current version: $versionName ($versionCode)"
            )

            val result = Arguments.createMap().apply {
                putDouble(
                    "versionCode",
                    versionCode.toDouble()
                )

                putString(
                    "versionName",
                    versionName
                )
            }

            promise.resolve(result)

        } catch (e: Exception) {
            Log.e(
                TAG,
                "Unable to read app version",
                e
            )

            promise.reject(
                "VERSION_ERROR",
                "Unable to read app version",
                e
            )
        }
    }

    // -------------------------------------------------------------------------
    // DOWNLOAD APK
    // -------------------------------------------------------------------------

@ReactMethod
fun downloadApk(
    url: String,
    fileName: String,
    promise: Promise
) {
    Thread {
        var connection: HttpURLConnection? = null

        try {
            Log.d(TAG, "downloadApk() called")
            Log.d(TAG, "URL: $url")
            Log.d(TAG, "File: $fileName")

            val uri = Uri.parse(url)
            val scheme = uri.scheme?.lowercase()

            if (
                scheme != "https" &&
                !(BuildConfig.DEBUG && scheme == "http")
            ) {
                promise.reject(
                    "DOWNLOAD_ERROR",
                    "APK URL must use HTTPS."
                )
                return@Thread
            }

            val safeFileName = fileName.replace(
                Regex("[^a-zA-Z0-9._-]"),
                "_"
            )

            val downloadsDir =
                context.getExternalFilesDir(
                    Environment.DIRECTORY_DOWNLOADS
                )

            if (downloadsDir == null) {
                promise.reject(
                    "DOWNLOAD_ERROR",
                    "External files directory is unavailable."
                )
                return@Thread
            }

            val updatesDir = File(
                downloadsDir,
                "updates"
            )

            if (!updatesDir.exists()) {
                updatesDir.mkdirs()
            }

            val apkFile = File(
                updatesDir,
                safeFileName
            )

            Log.d(
                TAG,
                "Saving APK to: ${apkFile.absolutePath}"
            )

            // Remove old APK if one exists.
            if (apkFile.exists()) {
                apkFile.delete()
            }

            val connectionUrl = URL(url)

            connection =
                connectionUrl.openConnection()
                    as HttpURLConnection

            connection.requestMethod = "GET"
            connection.connectTimeout = 15_000
            connection.readTimeout = 60_000
            connection.instanceFollowRedirects = true

            connection.connect()

            val responseCode = connection.responseCode

            Log.d(
                TAG,
                "HTTP response code: $responseCode"
            )

            if (
                responseCode !in 200..299
            ) {
                promise.reject(
                    "DOWNLOAD_ERROR",
                    "APK download failed. HTTP $responseCode"
                )
                return@Thread
            }

            val contentLength =
                connection.contentLengthLong

            Log.d(
                TAG,
                "APK size: $contentLength bytes"
            )

            BufferedInputStream(
                connection.inputStream
            ).use { input ->

                FileOutputStream(
                    apkFile
                ).use { output ->

                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    var totalBytes = 0L

                    while (
                        input.read(buffer).also {
                            bytesRead = it
                        } != -1
                    ) {
                        output.write(
                            buffer,
                            0,
                            bytesRead
                        )

                        totalBytes += bytesRead
                    }

                    output.flush()

                    Log.d(
                        TAG,
                        "APK downloaded: $totalBytes bytes"
                    )
                }
            }

            if (
                !apkFile.exists() ||
                apkFile.length() == 0L
            ) {
                promise.reject(
                    "DOWNLOAD_ERROR",
                    "APK file was not created correctly."
                )
                return@Thread
            }

            Log.d(
                TAG,
                "APK download successful"
            )

            promise.resolve(
                safeFileName
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "APK download failed",
                e
            )

            promise.reject(
                "DOWNLOAD_ERROR",
                e.message ?: "Unable to download APK.",
                e
            )

        } finally {
            connection?.disconnect()
        }
    }.start()
}

    // -------------------------------------------------------------------------
    // INSTALL APK
    // -------------------------------------------------------------------------

    @ReactMethod
    fun installApk(
        fileName: String,
        promise: Promise
    ) {
        try {
            Log.d(
                TAG,
                "installApk() called: $fileName"
            )

            // -------------------------------------------------------------
            // Check "Install unknown apps" permission
            // -------------------------------------------------------------

            if (
                Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.O
            ) {
                val canInstall =
                    context.packageManager
                        .canRequestPackageInstalls()

                Log.d(
                    TAG,
                    "Can request package installs: $canInstall"
                )

                if (!canInstall) {

                    val settingsIntent =
                        Intent(
                            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse(
                                "package:${context.packageName}"
                            )
                        ).apply {
                            addFlags(
                                Intent.FLAG_ACTIVITY_NEW_TASK
                            )
                        }

                    context.startActivity(
                        settingsIntent
                    )

                    promise.reject(
                        "INSTALL_PERMISSION_REQUIRED",
                        "Please allow GymManager to install unknown apps, then try again."
                    )

                    return
                }
            }

            // -------------------------------------------------------------
            // Find downloaded APK
            // -------------------------------------------------------------

            val downloadsDir =
                context.getExternalFilesDir(
                    Environment.DIRECTORY_DOWNLOADS
                )

            if (downloadsDir == null) {
                Log.e(
                    TAG,
                    "External files directory is unavailable"
                )

                promise.reject(
                    "APK_DIRECTORY_ERROR",
                    "Unable to access app download directory."
                )

                return
            }

            val updatesDir =
                File(
                    downloadsDir,
                    "updates"
                )

            val apkFile =
                File(
                    updatesDir,
                    fileName
                )

            Log.d(
                TAG,
                "APK path: ${apkFile.absolutePath}"
            )

            Log.d(
                TAG,
                "APK exists: ${apkFile.exists()}"
            )

            if (!apkFile.exists()) {

                promise.reject(
                    "APK_NOT_FOUND",
                    "Downloaded APK was not found."
                )

                return
            }

            if (apkFile.length() <= 0L) {

                promise.reject(
                    "APK_EMPTY",
                    "Downloaded APK is empty."
                )

                return
            }

            // -------------------------------------------------------------
            // Create FileProvider URI
            // -------------------------------------------------------------

            val authority =
                context.packageName +
                    FILE_PROVIDER_SUFFIX

            val apkUri =
                FileProvider.getUriForFile(
                    context,
                    authority,
                    apkFile
                )

            Log.d(
                TAG,
                "APK URI: $apkUri"
            )

            // -------------------------------------------------------------
            // Launch Android Package Installer
            // -------------------------------------------------------------

            val installIntent =
                Intent(Intent.ACTION_VIEW).apply {

                    setDataAndType(
                        apkUri,
                        APK_MIME_TYPE
                    )

                    addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK
                    )

                    addFlags(
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                }

            Log.d(
                TAG,
                "Starting Android package installer"
            )

            context.startActivity(
                installIntent
            )

            promise.resolve(true)

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Unable to start APK installation",
                e
            )

            promise.reject(
                "INSTALL_ERROR",
                "Unable to start APK installation.",
                e
            )
        }
    }

    // -------------------------------------------------------------------------
    // RECEIVER HELPERS
    // -------------------------------------------------------------------------

    private fun registerReceiverSafely(
        receiver: BroadcastReceiver,
        filter: IntentFilter
    ) {
        if (
            Build.VERSION.SDK_INT >=
            Build.VERSION_CODES.TIRAMISU
        ) {
            context.registerReceiver(
                receiver,
                filter,
                Context.RECEIVER_EXPORTED
            )
        } else {
            @Suppress("DEPRECATION")
            context.registerReceiver(
                receiver,
                filter
            )
        }
    }

    private fun unregisterReceiverSafely(
        receiver: BroadcastReceiver
    ) {
        try {
            context.unregisterReceiver(
                receiver
            )
        } catch (
            _: IllegalArgumentException
        ) {
            // Receiver was already unregistered.
        }
    }
}