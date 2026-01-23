import Login from '../../components/auth/Login';

export default function LoginPage() {
    const handleLogin = (email: string, password: string) => {
        console.log('Login attempt:', { email, password });
        // Navigate to rules page after login
        window.location.href = '/rules';
    };

    return <Login onLogin={handleLogin} />;
}
