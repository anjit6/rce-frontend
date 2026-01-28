import { useState, useEffect } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  loading?: boolean;
}

export default function RejectModal({ isOpen, onClose, onSubmit, loading = false }: RejectModalProps) {
  const [comment, setComment] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit(comment);
  };

  const handleClose = () => {
    if (!loading) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300);
    }
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
          <h2 className="text-2xl font-semibold text-gray-900">Reject Request</h2>
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
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-4">Comments</h3>
            <textarea
              placeholder="Enter comments for rejection..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={8}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none text-base text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200 bg-white">
          <Button
            onClick={handleClose}
            disabled={loading}
            className="px-8 h-11 rounded-lg border border-gray-300 hover:border-gray-400 font-medium text-base"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            danger
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
            className="px-8 h-11 rounded-lg bg-red-600 hover:bg-red-500 border-none font-semibold text-base"
          >
            Submit
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
