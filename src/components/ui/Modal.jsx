import PropTypes from "prop-types";

const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[150px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-2xl"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Modal;
