import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    const mockNavigate = jest.fn();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        __mockNavigate: mockNavigate
    };
});

jest.mock('@react-oauth/google', () => ({
    GoogleLogin: ({ onSuccess }) => (
        <button type="button" onClick={() => onSuccess({ credential: 'google-token' })}>
            Google Sign In
        </button>
    )
}));

const getNavigateMock = () => require('react-router-dom').__mockNavigate;

beforeEach(() => {
    getNavigateMock().mockClear();
    localStorage.clear();
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.clearAllMocks();
});

test('Google login success stores JWT and navigates', async () => {
    global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'jwt-token' })
    });

    render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /google sign in/i }));

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/users/google', expect.objectContaining({
            method: 'POST'
        }));
    });

    await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('jwt-token');
        expect(getNavigateMock()).toHaveBeenCalledWith('/dashboard');
    });
});
