import React from 'react';
import { Text, TextInput } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { MembershipStartDateSection } from '../src/presentation/components/MembershipStartDateSection';

test('shows a custom date text input for start date selection', () => {
  const onChange = jest.fn();
  const onCustomDateChange = jest.fn();

  let component!: renderer.ReactTestRenderer;

  act(() => {
    component = renderer.create(
      <MembershipStartDateSection
        previousEndDate="2025-01-15"
        selected="custom"
        customDate="2025-01-20"
        onChange={onChange}
        onCustomDateChange={onCustomDateChange}
      />,
    );
  });

  const labels = component.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flatMap(value => (Array.isArray(value) ? value : [value]));

  expect(labels).toContain('Custom date');

  const customInput = component.root.findByType(TextInput);
  expect(customInput.props.placeholder).toBe('YYYY-MM-DD');
  expect(customInput.props.value).toBe('2025-01-20');
});
