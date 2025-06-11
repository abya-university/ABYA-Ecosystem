
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';

const ProfileFormPopup = ({ isOpen, onClose, onSubmit, initialData = {} }) => {
    const { profile } = useProfile(); // Use the profile context
    const [formData, setFormData] = useState({
        // Personal Information
        fullName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        countryOfResidence: '',
        preferredLanguages: ['English'], // You might want to keep a default like English, or make it []
        
        // Academic Background
        highestEducation: '',
        fieldsOfStudy: [''],
        institutions: [''],
        graduationYear: '',
        achievements: [''],
        enrollmentStatus: '',
        
        // Technical Skills
        programmingLanguages: [{ name: '', level: 'Basic' }],
        softwareProficiency: [''],
        otherTechnicalSkills: [''],
        
        // Soft Skills
        communication: '',
        teamwork: '',
        problemSolving: '',
        leadership: '',
        timeManagement: '',
        
        // Languages
        nativeLanguage: '',
        otherLanguages: [{ language: '', speaking: 'Basic', reading: 'Basic', writing: 'Basic' }],
        
        // Certifications
        certifications: [{ name: '', issuingOrganization: '', dateObtained: '', expiryDate: '' }],
        
        // Professional Experience
        employmentStatus: '',
        jobTitles: [''],
        employers: [''],
        employmentDuration: [''],
        responsibilities: [''],
        
        // Internships & Volunteer Work
        volunteerWork: [{ organizationName: '', role: '', duration: '', keyResponsibilitiesAndAchievements: [''] }],
        
        // Career Goals
        shortTermGoals: '',
        longTermGoals: '',
        preferredIndustries: [''],
        desiredJobTitles: [''],
        motivation: '',
        keyFactors: [''],
        
        // Learning Preferences
        learningStyle: [''],
        skillsToAcquire: [''],
        knowledgeAreas: [''],
        learningChallenges: [''],
        
        // Feedback & Support
        preferredFeedback: [''],
        supportNeeded: [''],
        positiveAspects: '',
        areasForImprovement: ''
      });

    // Use useEffect to update formData when the profile changes or when the popup opens
    useEffect(() => {
      if (isOpen && profile) {
          setFormData(prev => ({
              ...prev,
              // Personal Information auto-fill
              fullName: `${profile.firstName || ''} ${profile.secondName || ''}`.trim(),
              dateOfBirth: profile.dateOfBirth || '',
              gender: profile.gender || '',
              email: profile.email || '',
              countryOfResidence: profile.countryOfResidence || '',
              preferredLanguages: profile.preferredLanguages ? 
                                  (Array.isArray(profile.preferredLanguages) ? profile.preferredLanguages : profile.preferredLanguages.split(',').map(lang => lang.trim())) 
                                  : ['English'], // Handle potential string or array for languages
          }));
      }
  }, [isOpen, profile]); // Depend on isOpen and profile


  const proficiencyLevels = ['Basic', 'Intermediate', 'Advanced', 'Expert'];
  const genderOptions = ['Male', 'Female', 'Prefer not to say'];
  const enrollmentStatuses = ['Full-time Student', 'Part-time Student', 'Graduate', 'Not Enrolled'];
  const employmentStatuses = ['Student', 'Employed', 'Unemployed', 'Self-employed', 'Freelancer'];
  const learningStyles = ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'];
  const feedbackTypes = ['Immediate', 'Detailed', 'Regular', 'Constructive'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field, defaultValue = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-200 mt-[100px] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-yellow-500 p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
          <button onClick={onClose} className="text-gray-800 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Personal Information */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  {genderOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Residence</label>
                <input
                  type="text"
                  value={formData.countryOfResidence}
                  onChange={(e) => handleInputChange('countryOfResidence', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Languages</label>
              {formData.preferredLanguages.map((lang, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={lang}
                    onChange={(e) => handleArrayChange('preferredLanguages', index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Language"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('preferredLanguages', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('preferredLanguages')}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Language
              </button>
            </div>
          </section>

          {/* Academic Background */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Academic Background</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Highest Level of Education</label>
                <input
                  type="text"
                  value={formData.highestEducation}
                  onChange={(e) => handleInputChange('highestEducation', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={formData.graduationYear}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Enrollment Status</label>
                <select
                  value={formData.enrollmentStatus}
                  onChange={(e) => handleInputChange('enrollmentStatus', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  {enrollmentStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fields of Study */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Fields of Study</label>
              {formData.fieldsOfStudy.map((field, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={field}
                    onChange={(e) => handleArrayChange('fieldsOfStudy', index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Field of Study"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('fieldsOfStudy', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('fieldsOfStudy')}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Field
              </button>
            </div>

            {/* Institutions */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Institutions</label>
              {formData.institutions.map((institution, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => handleArrayChange('institutions', index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Institution Name"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('institutions', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('institutions')}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Institution
              </button>
            </div>
          </section>

          {/* Technical Skills */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Technical Skills</h3>
            
            {/* Programming Languages */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Programming Languages</label>
              {formData.programmingLanguages.map((lang, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={lang.name}
                    onChange={(e) => handleArrayChange('programmingLanguages', index, {...lang, name: e.target.value})}
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Language Name"
                  />
                  <select
                    value={lang.level}
                    onChange={(e) => handleArrayChange('programmingLanguages', index, {...lang, level: e.target.value})}
                    className="w-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    {proficiencyLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('programmingLanguages', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('programmingLanguages', { name: '', level: 'Basic' })}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Language
              </button>
            </div>

            {/* Software Proficiency */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Software Proficiency</label>
              {formData.softwareProficiency.map((software, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={software}
                    onChange={(e) => handleArrayChange('softwareProficiency', index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Software/Tool"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('softwareProficiency', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('softwareProficiency')}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Software
              </button>
            </div>
          </section>

          {/* Soft Skills */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Soft Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Communication</label>
                <textarea
                  value={formData.communication}
                  onChange={(e) => handleInputChange('communication', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teamwork</label>
                <textarea
                  value={formData.teamwork}
                  onChange={(e) => handleInputChange('teamwork', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem Solving</label>
                <textarea
                  value={formData.problemSolving}
                  onChange={(e) => handleInputChange('problemSolving', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leadership</label>
                <textarea
                  value={formData.leadership}
                  onChange={(e) => handleInputChange('leadership', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Management</label>
                <textarea
                  value={formData.timeManagement}
                  onChange={(e) => handleInputChange('timeManagement', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
            </div>
          </section>

          {/* Career Goals */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Career Goals & Aspirations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Term Career Goals</label>
                <textarea
                  value={formData.shortTermGoals}
                  onChange={(e) => handleInputChange('shortTermGoals', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Long Term Career Goals</label>
                <textarea
                  value={formData.longTermGoals}
                  onChange={(e) => handleInputChange('longTermGoals', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivation for Career Choice</label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
            </div>
          </section>

          {/* Learning Preferences */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Learning Preferences</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Learning Style</label>
              <div className="flex flex-wrap gap-2">
                {learningStyles.map(style => (
                  <label key={style} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.learningStyle.includes(style)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('learningStyle', [...formData.learningStyle, style]);
                        } else {
                          handleInputChange('learningStyle', formData.learningStyle.filter(s => s !== style));
                        }
                      }}
                      className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-sm">{style}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills to Acquire</label>
              {formData.skillsToAcquire.map((skill, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayChange('skillsToAcquire', index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Skill to acquire"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('skillsToAcquire', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('skillsToAcquire')}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Skill
              </button>
            </div>
          </section>

          {/* Feedback & Support */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Feedback & Support</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Type of Feedback</label>
              <div className="flex flex-wrap gap-2">
                {feedbackTypes.map(type => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.preferredFeedback.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('preferredFeedback', [...formData.preferredFeedback, type]);
                        } else {
                          handleInputChange('preferredFeedback', formData.preferredFeedback.filter(f => f !== type));
                        }
                      }}
                      className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Positive Learning Aspects</label>
                <textarea
                  value={formData.positiveAspects}
                  onChange={(e) => handleInputChange('positiveAspects', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                <textarea
                  value={formData.areasForImprovement}
                  onChange={(e) => handleInputChange('areasForImprovement', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="3"
                />
              </div>
            </div>
          </section>

          {/* Professional Experience */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Professional Experience</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Employment Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select Status</option>
                {employmentStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Titles & Roles</label>
                {formData.jobTitles.map((title, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleArrayChange('jobTitles', index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Job Title"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('jobTitles', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('jobTitles')}
                  className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
                >
                  <Plus size={16} /> Add Job Title
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employers</label>
                {formData.employers.map((employer, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={employer}
                      onChange={(e) => handleArrayChange('employers', index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Employer Name"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('employers', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('employers')}
                  className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
                >
                  <Plus size={16} /> Add Employer
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Duration</label>
              {formData.employmentDuration.map((duration, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => handleArrayChange('employmentDuration', index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="e.g., Jan 2023 - Present"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('employmentDuration', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('employmentDuration')}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Duration
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities & Achievements</label>
              {formData.responsibilities.map((responsibility, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <textarea
                    value={responsibility}
                    onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Describe key responsibilities and achievements"
                    rows="2"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('responsibilities', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('responsibilities')}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Responsibility
              </button>
            </div>

            {/* Volunteer Work */}
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Internships & Volunteer Work</h4>
              {formData.volunteerWork.map((work, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                      <input
                        type="text"
                        value={work.organizationName}
                        onChange={(e) => handleArrayChange('volunteerWork', index, {...work, organizationName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Organization Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <input
                        type="text"
                        value={work.role}
                        onChange={(e) => handleArrayChange('volunteerWork', index, {...work, role: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Your Role"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={work.duration}
                      onChange={(e) => handleArrayChange('volunteerWork', index, {...work, duration: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Duration (e.g., 2022-present)"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities & Achievements</label>
                    {work.keyResponsibilitiesAndAchievements.map((achievement, achIndex) => (
                      <div key={achIndex} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={achievement}
                          onChange={(e) => {
                            const newAchievements = [...work.keyResponsibilitiesAndAchievements];
                            newAchievements[achIndex] = e.target.value;
                            handleArrayChange('volunteerWork', index, {...work, keyResponsibilitiesAndAchievements: newAchievements});
                          }}
                          className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          placeholder="Achievement or responsibility"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newAchievements = work.keyResponsibilitiesAndAchievements.filter((_, i) => i !== achIndex);
                            handleArrayChange('volunteerWork', index, {...work, keyResponsibilitiesAndAchievements: newAchievements});
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newAchievements = [...work.keyResponsibilitiesAndAchievements, ''];
                        handleArrayChange('volunteerWork', index, {...work, keyResponsibilitiesAndAchievements: newAchievements});
                      }}
                      className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800 text-sm"
                    >
                      <Plus size={14} /> Add Achievement
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('volunteerWork', index)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} /> Remove Volunteer Work
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('volunteerWork', { organizationName: '', role: '', duration: '', keyResponsibilitiesAndAchievements: [''] })}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Volunteer Work
              </button>
            </div>
          </section>

          {/* Certifications */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Certifications & Licenses</h3>
            {formData.certifications.map((cert, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => handleArrayChange('certifications', index, {...cert, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Certification Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
                    <input
                      type="text"
                      value={cert.issuingOrganization}
                      onChange={(e) => handleArrayChange('certifications', index, {...cert, issuingOrganization: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Issuing Organization"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Obtained</label>
                    <input
                      type="date"
                      value={cert.dateObtained}
                      onChange={(e) => handleArrayChange('certifications', index, {...cert, dateObtained: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={cert.expiryDate}
                      onChange={(e) => handleArrayChange('certifications', index, {...cert, expiryDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeArrayItem('certifications', index)}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700 mt-3"
                >
                  <Trash2 size={16} /> Remove Certification
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('certifications', { name: '', issuingOrganization: '', dateObtained: '', expiryDate: '' })}
              className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
            >
              <Plus size={16} /> Add Certification
            </button>
          </section>

          {/* Languages Spoken */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">Languages Spoken</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Native Language</label>
              <input
                type="text"
                value={formData.nativeLanguage}
                onChange={(e) => handleInputChange('nativeLanguage', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Native Language"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Languages</label>
              {formData.otherLanguages.map((lang, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <input
                        type="text"
                        value={lang.language}
                        onChange={(e) => handleArrayChange('otherLanguages', index, {...lang, language: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Language"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Speaking</label>
                      <select
                        value={lang.speaking}
                        onChange={(e) => handleArrayChange('otherLanguages', index, {...lang, speaking: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        {proficiencyLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reading</label>
                      <select
                        value={lang.reading}
                        onChange={(e) => handleArrayChange('otherLanguages', index, {...lang, reading: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        {proficiencyLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Writing</label>
                      <select
                        value={lang.writing}
                        onChange={(e) => handleArrayChange('otherLanguages', index, {...lang, writing: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        {proficiencyLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('otherLanguages', index)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 mt-3"
                  >
                    <Trash2 size={16} /> Remove Language
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('otherLanguages', { language: '', speaking: 'Basic', reading: 'Basic', writing: 'Basic' })}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
              >
                <Plus size={16} /> Add Language
              </button>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-yellow-500 text-gray-800 rounded-md hover:bg-yellow-600 transition-colors font-medium"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>

    );
};

export default ProfileFormPopup; 