import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Field, Modal } from './ui';

describe('Field', () => {
  it('links label, input and error message for accessibility', () => {
    render(<Field label="Email" error="Enter a valid email" defaultValue="x" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
  });
});

describe('Modal', () => {
  it('renders as a dialog and closes on Escape', async () => {
    let closed = false;
    render(<Modal open onClose={() => (closed = true)} title="Confirm">content</Modal>);
    expect(screen.getByRole('dialog', { name: 'Confirm' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(closed).toBe(true);
  });
});
