import { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextArea = ({ label, error, ...props }: TextAreaProps) => {
  return (
    <div>
      <label className='block text-sm font-medium text-gray-700'>{label}</label>
      <textarea
        {...props}
        className={`
          mt-1 block w-full rounded-md shadow-sm
          px-3 py-2
          text-base
          leading-relaxed
          resize-y
          min-h-[200px]
          ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }
        `}
      />
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  );
};
