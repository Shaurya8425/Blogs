import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "default" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const baseClasses = "rounded-md font-medium transition-colors duration-200";
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    default: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${
    variantClasses[variant]
  } ${fullWidth ? "w-full" : ""} ${className}`;

  return (
    <button disabled={disabled || isLoading} className={classes} {...props}>
      {children}
    </button>
  );
};
