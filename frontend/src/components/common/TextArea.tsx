import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { forwardRef } from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Textarea ref={ref} className={className} {...props} />
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
