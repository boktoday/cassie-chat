import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { dbManager, UserContext } from '../../utils/indexedDB';
import { useTranslations } from 'next-intl';

interface ContextFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (context: UserContext) => void;
}

export const ContextForm: React.FC<ContextFormProps> = ({ isVisible, onClose, onSave }) => {
  const t = useTranslations('HomePage');
  const [formData, setFormData] = useState({
    childName: '',
    goals: '',
    individualEducationPlan: '',
    functionalAssessment: '',
    ndisplan: '',
    otherInformation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadUserContext();
    }
  }, [isVisible]);

  const loadUserContext = async () => {
    setIsLoading(true);
    try {
      const context = await dbManager.getUserContext();
      if (context) {
        setFormData({
          childName: context.childName || '',
          goals: context.goals || '',
          individualEducationPlan: context.individualEducationPlan || '',
          functionalAssessment: context.functionalAssessment || '',
          ndisplan: context.ndisplan || '',
          otherInformation: context.otherInformation || '',
        });
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dbManager.saveUserContext(formData);
      const savedContext = await dbManager.getUserContext();
      if (savedContext) {
        onSave(savedContext);
      }
      onClose();
    } catch (error) {
      console.error('Error saving user context:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-background)] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-button-border-in)]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--color-text)]" />
            <h2 className="text-xl font-semibold text-[var(--color-text)]">User Context Information</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-hover)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text)]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-[var(--color-text)]">Loading context...</div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Child Name
                </label>
                <input
                  type="text"
                  value={formData.childName}
                  onChange={(e) => handleInputChange('childName', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-button-border-in)] rounded-md bg-[var(--color-button-background-in)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-button-border-primary-in)] focus:border-transparent"
                  placeholder="Enter child's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Goals
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--color-button-border-in)] rounded-md bg-[var(--color-button-background-in)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-button-border-primary-in)] focus:border-transparent resize-none"
                  placeholder="Enter goals and objectives"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Individual Education Plan (IEP)
                </label>
                <textarea
                  value={formData.individualEducationPlan}
                  onChange={(e) => handleInputChange('individualEducationPlan', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--color-button-border-in)] rounded-md bg-[var(--color-button-background-in)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-button-border-primary-in)] focus:border-transparent resize-none"
                  placeholder="Enter Individual Education Plan details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Functional Assessment
                </label>
                <textarea
                  value={formData.functionalAssessment}
                  onChange={(e) => handleInputChange('functionalAssessment', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--color-button-border-in)] rounded-md bg-[var(--color-button-background-in)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-button-border-primary-in)] focus:border-transparent resize-none"
                  placeholder="Enter functional assessment information"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  NDIS Plan
                </label>
                <textarea
                  value={formData.ndisplan}
                  onChange={(e) => handleInputChange('ndisplan', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--color-button-border-in)] rounded-md bg-[var(--color-button-background-in)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-button-border-primary-in)] focus:border-transparent resize-none"
                  placeholder="Enter NDIS plan details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Other Information
                </label>
                <textarea
                  value={formData.otherInformation}
                  onChange={(e) => handleInputChange('otherInformation', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--color-button-border-in)] rounded-md bg-[var(--color-button-background-in)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-button-border-primary-in)] focus:border-transparent resize-none"
                  placeholder="Enter any additional relevant information"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-button-border-in)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--color-text)] bg-[var(--color-button-background-in)] border border-[var(--color-button-border-in)] rounded-md hover:bg-[var(--color-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[var(--color-button-background-primary-in)] text-[var(--color-button-icon-primary-in)] border border-[var(--color-button-border-primary-in)] rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Context'}
          </button>
        </div>
      </div>
    </div>
  );
};