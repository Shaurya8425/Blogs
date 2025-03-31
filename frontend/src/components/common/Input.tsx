import { Input as BaseInput } from "../ui/input";
import { Label } from "../ui/label";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <BaseInput ref={ref} className={className} {...props} />
      </div>
    );
  }
);

Input.displayName = "Input";
