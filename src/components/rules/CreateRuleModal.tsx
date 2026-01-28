import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface CreateRuleModalProps {
    isOpen: boolean;
    ruleType: 'static' | 'dynamic' | null;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string }) => void | Promise<void>;
    loading?: boolean;
}

export default function CreateRuleModal({ isOpen, ruleType, onClose, onSubmit, loading = false }: CreateRuleModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [nameError, setNameError] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    // Reset form when panel opens/closes
    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
        } else {
            setName('');
            setDescription('');
            setNameError('');
        }
    }, [isOpen]);

    const handleClose = () => {
        if (!loading) {
            setIsClosing(true);
            setTimeout(() => {
                onClose();
                setIsClosing(false);
            }, 300);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) {
            setNameError('Please enter a rule name');
            return;
        }

        setNameError('');
        onSubmit({ name: name.trim(), description: description.trim() });

        // Reset form
        setName('');
        setDescription('');
    };

    const getRuleTypeLabel = () => {
        if (ruleType === 'static') return 'Data Transformation Rule';
        if (ruleType === 'dynamic') return 'Data Processing Rule';
        return '';
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-20 z-40"
                onClick={handleClose}
            />

            {/* Sliding Panel */}
            <div
                className="fixed top-0 right-0 h-full bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200 flex flex-col"
                style={{
                    width: '600px',
                    animation: isClosing ? 'slideOutToRight 0.3s ease-in' : 'slideInFromRight 0.3s ease-out',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Create Rule</h2>
                        {ruleType && (
                            <p className="text-sm text-gray-500 font-normal mt-1">
                                {getRuleTypeLabel()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <CloseOutlined className="text-xl" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <form onSubmit={handleSubmit} id="create-rule-form">
                        {/* Rule Name */}
                        <div className="mb-5">
                            <Label htmlFor="rule-name" className="text-sm font-medium text-gray-700 mb-2 block">
                                Rule Name *
                            </Label>
                            <Input
                                id="rule-name"
                                placeholder="Rule Name..."
                                inputSize="lg"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (nameError) setNameError('');
                                }}
                                variant={nameError ? 'error' : 'default'}
                                className="rounded-lg"
                            />
                            {nameError && (
                                <p className="text-sm text-red-500 mt-1">{nameError}</p>
                            )}
                        </div>

                        {/* Rule Description */}
                        <div className="mb-6">
                            <Label htmlFor="rule-description" className="text-sm font-medium text-gray-700 mb-2 block">
                                Rule Description
                            </Label>
                            <Textarea
                                id="rule-description"
                                placeholder="Rule Description ..."
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded-lg resize-none"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200 bg-white">
                    <Button
                        onClick={handleClose}
                        size="large"
                        disabled={loading}
                        className="rounded-lg px-6 hover:border-red-500 hover:text-gray-900 focus:border-red-500 focus:text-gray-900"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        form="create-rule-form"
                        size="large"
                        loading={loading}
                        className="rounded-lg px-6 bg-red-600 hover:bg-red-500 focus:bg-red-500 border-none"
                    >
                        Create
                    </Button>
                </div>
            </div>

            <style>{`
                @keyframes slideInFromRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                @keyframes slideOutToRight {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </>
    );
}
