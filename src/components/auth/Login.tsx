import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/assets/images/logo.png';

interface LoginFormValues {
    email: string;
    password: string;
    remember: boolean;
}

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [form] = Form.useForm();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect to rules page if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/rules', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handleSubmit = async (values: LoginFormValues) => {
        setIsLoading(true);

        try {
            await login(values.email, values.password);
            message.success('Login successful!');
            navigate('/rules');
        } catch (error: any) {
            message.error(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                        <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Rules Configuration Engine</h1>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Welcome Text */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                        <p className="text-gray-500">Sign in to your account to continue</p>
                    </div>

                    {/* Login Form */}
                    <Form
                        form={form}
                        name="login"
                        onFinish={handleSubmit}
                        layout="vertical"
                        requiredMark={false}
                        initialValues={{ remember: true }}
                    >
                        {/* Email Field */}
                        <Form.Item
                            name="email"
                            label={<span className="text-sm font-medium text-gray-700">Email Address</span>}
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="Enter your email"
                                size="large"
                                className="login-input rounded-xl py-3"
                            />
                        </Form.Item>

                        {/* Password Field */}
                        <Form.Item
                            name="password"
                            label={<span className="text-sm font-medium text-gray-700">Password</span>}
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Enter your password"
                                size="large"
                                className="login-input rounded-xl py-3"
                                iconRender={(visible) => (visible ? <EyeTwoTone twoToneColor="#dc2626" /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>

                        {/* Login Button */}
                        <Form.Item className="mb-0">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isLoading}
                                size="large"
                                block
                                className="h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 border-none shadow-lg shadow-red-500/30 hover:shadow-red-500/40 font-semibold"
                                icon={!isLoading && <ArrowRightOutlined />}
                                iconPosition="end"
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <a href="#" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                        Contact Admin
                    </a>
                </p>
            </div>
        </div>
    );
}
