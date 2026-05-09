import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    const mockNavigate = jest.fn();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        __mockNavigate: mockNavigate
    };
});

const getNavigateMock = () => require('react-router-dom').__mockNavigate;

const fillRegistrationForm = ({
    email = 'user@example.com',
    firstName = 'Alex',
    lastName = 'Barber',
    password = 'Password123',
    confirmPassword = 'Password123'
} = {}) => {
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: email }
    });
    fireEvent.change(screen.getByPlaceholderText(/first/i), {
        target: { value: firstName }
    });
    fireEvent.change(screen.getByPlaceholderText(/last/i), {
        target: { value: lastName }
    });
    fireEvent.change(screen.getByPlaceholderText(/create a password/i), {
        target: { value: password }
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
        target: { value: confirmPassword }
    });
};

beforeEach(() => {
    getNavigateMock().mockClear();
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.clearAllMocks();
});

test('shows an error when passwords do not match', async () => {
    render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );

    fillRegistrationForm({ confirmPassword: 'Mismatch123' });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
});

test('shows confirmation after successful registration', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );

    fillRegistrationForm();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/account created/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/users', expect.objectContaining({
        method: 'POST'
    }));
});

test('navigates to dashboard from confirmation screen', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );

    fillRegistrationForm();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await screen.findByText(/account created/i);

    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));

    await waitFor(() => {
        expect(getNavigateMock()).toHaveBeenCalledWith('/dashboard');
    });
});

test('shows an error when backend rejects registration', async () => {
    global.fetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );

    fillRegistrationForm();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/failed to create account/i)).toBeInTheDocument();
});

test('shows an error when registration request fails', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );

    fillRegistrationForm();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/an error occurred during registration/i)).toBeInTheDocument();
});
