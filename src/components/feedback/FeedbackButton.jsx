import React, { useState } from 'react';
import { FeedbackWorkflow } from '@questlabs/react-sdk';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import questConfig from '../../questConfig';

const { FiMessageCircle } = FiIcons;

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const EventTracking = () => {
    // Optional: Add analytics tracking here
    console.log('Feedback button clicked');
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => {
          EventTracking();
          setIsOpen((prev) => !prev);
        }}
        style={{ 
          background: questConfig.PRIMARY_COLOR,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
        className="fixed top-1/2 -right-2 transform -translate-y-1/2 rotate-90 bg-blue-600 text-white px-4 py-2 rounded-t-lg rounded-b-none shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 flex items-center gap-2 text-sm font-medium"
        title="Feedback geben"
      >
        <div className="transform -rotate-90">
          <SafeIcon icon={FiMessageCircle} className="w-4 h-4" />
        </div>
        <span className="transform -rotate-90 whitespace-nowrap">Feedback</span>
      </button>

      {/* Feedback Workflow Component */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <FeedbackWorkflow
              uniqueUserId={localStorage.getItem('userId') || questConfig.USER_ID}
              questId={questConfig.QUEST_FEEDBACK_QUESTID}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              primaryColor={questConfig.PRIMARY_COLOR}
            >
              <FeedbackWorkflow.ThankYou />
            </FeedbackWorkflow>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;