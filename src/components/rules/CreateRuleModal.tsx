import { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
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

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDescription('');
            setNameError('');
        }
    }, [isOpen]);

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

    return (
        <Modal
            title={
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Create Rule</h2>
                    {ruleType && (
                        <p className="text-sm text-gray-500 font-normal mt-1">
                            {getRuleTypeLabel()}
                        </p>
                    )}
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={450}
            centered
            destroyOnClose
            className="create-rule-modal"
        >
            <form onSubmit={handleSubmit} className="mt-6">
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

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button
                        onClick={onClose}
                        size="large"
                        disabled={loading}
                        className="rounded-lg px-6 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={loading}
                        className="rounded-lg px-6 bg-red-600 hover:bg-red-500 focus:bg-red-500 border-none"
                    >
                        Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
