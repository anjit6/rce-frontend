import { useState } from 'react';
import { Form, Input, Button, Checkbox, Divider, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';

interface LoginProps {
    onLogin?: (email: string, password: string) => void;
}

interface LoginFormValues {
    email: string;
    password: string;
    remember: boolean;
}

export default function Login({ onLogin }: LoginProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async (values: LoginFormValues) => {
        setIsLoading(true);

        // Simulate login delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (onLogin) {
            onLogin(values.email, values.password);
        }

        message.success('Login successful!');
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
                {/* Animated Background Shapes */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1000ms' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-2xl">
                            <svg width="32" height="32" viewBox="0 0 24 24" className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Rules Configuration</h1>
                            <p className="text-red-100 text-sm">Engine</p>
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                        Build, Test & Deploy<br />
                        Business Rules<br />
                        <span className="text-red-200">With Confidence</span>
                    </h2>

                    <p className="text-red-100 text-lg mb-10 max-w-md">
                        Create powerful data transformation rules with our intuitive visual builder.
                        Manage approvals, versioning, and deployments all in one place.
                    </p>

                    {/* Feature Highlights */}
                    <div className="space-y-4">
                        {[
                            'Visual Rule Builder',
                            'Multi-Stage Approval Workflow',
                            'Version Control & History',
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 text-white">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decorative Triangle */}
                <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[200px] border-l-transparent border-b-[200px] border-b-white/5" />
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" className="w-6 h-6 text-white flex-shrink-0" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-800">RCE</span>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
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
                                prefix={<MailOutlined className="text-gray-400" />}
                                placeholder="Enter your email"
                                size="large"
                                className="rounded-xl py-3"
                            />
                        </Form.Item>

                        {/* Password Field */}
                        <Form.Item
                            name="password"
                            label={<span className="text-sm font-medium text-gray-700">Password</span>}
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-400" />}
                                placeholder="Enter your password"
                                size="large"
                                className="rounded-xl py-3"
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>

                        {/* Remember Me & Forgot Password */}
                        <Form.Item>
                            <div className="flex items-center justify-between">
                                <Form.Item name="remember" valuePropName="checked" noStyle>
                                    <Checkbox className="text-gray-600">Remember me</Checkbox>
                                </Form.Item>
                                <a href="#" className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        </Form.Item>

                        {/* Login Button */}
                        <Form.Item>
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

                    {/* Divider */}
                    <Divider className="text-gray-400">or continue with</Divider>

                    {/* SSO Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            size="large"
                            className="h-12 rounded-xl flex items-center justify-center gap-2 border-gray-200 hover:border-gray-300"
                            icon={
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            }
                        >
                            Google
                        </Button>
                        <Button
                            size="large"
                            className="h-12 rounded-xl flex items-center justify-center gap-2 border-gray-200 hover:border-gray-300"
                            icon={
                                <svg className="w-5 h-5" fill="#00A4EF" viewBox="0 0 24 24">
                                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                                </svg>
                            }
                        >
                            Microsoft
                        </Button>
                    </div>

                    {/* Footer */}
                    <p className="mt-8 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <a href="#" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                            Contact Admin
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
