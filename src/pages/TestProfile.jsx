import React from 'react';
import { useProfile } from '../contexts/ProfileContext';

/**
 * ProfileConsumer
 * ---------------
 * Reads the current profile from ProfileContext and renders
 * DID, First Name, Second Name, and Email in a simple card.
 */
export default function ProfileConsumer() {
  const { profile } = useProfile();
  const { did, firstName, secondName, email } = profile || {};

  // If no profile data is set yet
  if (!did) {
    return (
      <div className="p-4 bg-gray-100 rounded shadow-sm">
        <p className="text-gray-600">No profile loaded.</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">User Profile</h2>
      <ul className="space-y-1 text-gray-700">
        <li>
          <strong>DID:</strong> <span className="font-mono text-sm">{did}</span>
        </li>
        <li>
          <strong>First Name:</strong> {firstName || '—'}
        </li>
        <li>
          <strong>Second Name:</strong> {secondName || '—'}
        </li>
        <li>
          <strong>Email:</strong> {email || '—'}
        </li>
      </ul>
    </div>
  );
}
