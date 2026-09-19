import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { CollectionReport } from '../../domain/entities/CollectionReport';
import { collectionReportToCsv } from '../../application/utils/collectionReportCsv';

export async function exportCollectionCsv(
  report: CollectionReport,
  fileName: string,
): Promise<void> {
  const csv = collectionReportToCsv(report);

  const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

  await RNFS.writeFile(path, '\uFEFF' + csv, 'utf8');

  await Share.open({
    title: 'Export Collection Report',
    url: `file://${path}`,
    type: 'text/csv',
    filename: fileName,
    failOnCancel: false,
  });
}
