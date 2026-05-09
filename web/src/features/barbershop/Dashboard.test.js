import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    const mockNavigate = jest.fn();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        __mockNavigate: mockNavigate
    };
});

jest.mock('@react-google-maps/api', () => ({
    __esModule: true,
    GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
    Marker: () => <div data-testid="map-marker" />,
    useJsApiLoader: () => ({ isLoaded: false })
}));

const buildResponse = (status, body) => {
    const ok = status >= 200 && status < 300;
    return Promise.resolve({
        ok,
        status,
        json: async () => body,
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
    });
};

const mockFetch = ({
    userStatus = 200,
    userBody = { firstName: 'Alex', lastName: 'Barber', email: 'alex@example.com' },
    shopsStatus = 200,
    shopsBody = []
} = {}) => {
    global.fetch = jest.fn((url) => {
        if (url.includes('/api/users/me')) {
            return buildResponse(userStatus, userBody);
        }
        if (url.includes('/api/shops')) {
            return buildResponse(shopsStatus, shopsBody);
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
};

const sampleShops = [
    {
        shopId: 1,
        name: 'Classic Cuts',
        description: 'Traditional cuts with a modern finish.',
        address: '123 Main Street',
        latitude: 10.3157,
        longitude: 123.8854,
        contactInfo: '0917-000-0000',
        showcaseImages: ['https://example.com/shop.jpg']
    },
    {
        shopId: 2,
        name: 'Modern Fade',
        description: 'Fresh fades and sharp lines.',
        address: '456 Uptown Ave',
        latitude: 10.3257,
        longitude: 123.8954,
        contactInfo: '0917-111-1111',
        showcaseImages: ['https://example.com/shop2.jpg']
    }
];

const getNavigateMock = () => require('react-router-dom').__mockNavigate;

beforeEach(() => {
    getNavigateMock().mockClear();
    localStorage.clear();
    Object.defineProperty(global.navigator, 'geolocation', {
        value: {
            getCurrentPosition: jest.fn()
        },
        configurable: true
    });
});

afterEach(() => {
    jest.clearAllMocks();
});

test('redirects to login when no token is present', async () => {
    mockFetch();

    render(<Dashboard />);

    await waitFor(() => {
        expect(getNavigateMock()).toHaveBeenCalledWith('/login', { replace: true });
    });

    expect(global.fetch).not.toHaveBeenCalled();
});

test('renders barbershop cards after loading', async () => {
    localStorage.setItem('token', 'test-token');
    mockFetch({ shopsBody: sampleShops });

    render(<Dashboard />);

    const shopTitles = await screen.findAllByText('Classic Cuts');
    expect(shopTitles.length).toBeGreaterThan(0);
    const viewButtons = await screen.findAllByRole('button', { name: /view details/i });
    expect(viewButtons.length).toBeGreaterThan(0);
});

test('shows error when barbershop load fails', async () => {
    localStorage.setItem('token', 'test-token');
    mockFetch({ shopsStatus: 500, shopsBody: { message: 'Server error' } });

    render(<Dashboard />);

    expect(await screen.findByText(/could not load barbershops/i)).toBeInTheDocument();
});

test('opens and closes the details modal', async () => {
    localStorage.setItem('token', 'test-token');
    mockFetch({ shopsBody: sampleShops });

    render(<Dashboard />);

    const viewDetailsButtons = await screen.findAllByRole('button', { name: /view details/i });
    fireEvent.click(viewDetailsButtons[0]);

    expect(screen.getByText('Proceed to Booking')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: '\u2715' });
    fireEvent.click(closeButton);

    await waitFor(() => {
        expect(screen.queryByText('Proceed to Booking')).not.toBeInTheDocument();
    });
});

test('proceed to booking navigates with selected shop', async () => {
    localStorage.setItem('token', 'test-token');
    mockFetch({ shopsBody: sampleShops });

    render(<Dashboard />);

    const viewDetailsButton = await screen.findAllByRole('button', { name: /view details/i });
    fireEvent.click(viewDetailsButton[0]);

    const proceedButton = screen.getByRole('button', { name: /proceed to booking/i });
    fireEvent.click(proceedButton);

    await waitFor(() => {
        expect(getNavigateMock()).toHaveBeenCalledWith('/booking', {
            state: {
                shop: expect.objectContaining({
                    id: 1,
                    name: 'Classic Cuts'
                })
            }
        });
    });
});
