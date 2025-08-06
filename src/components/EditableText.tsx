// EditableText.tsx
import React, { useState, useRef, useEffect } from "react";

interface EditableTextProps {
  text: string;
  onSave: (newText: string) => void;
  placeholder?: string;
  className?: string;
  inputId: string;
  editing?: boolean; // <<< adicionada
}

export const EditableText: React.FC<EditableTextProps> = ({
  text,
  onSave,
  placeholder = "",
  className = "",
  inputId,
  editing = false, // <<< default
}) => {
  // inicia isEditing de acordo com a prop
  const [isEditing, setIsEditing] = useState(editing);
  const [value, setValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  // se a prop mudar para true, dispara o modo edição
  useEffect(() => {
    if (editing) {
      setIsEditing(true);
    }
  }, [editing]);

  // foco automático
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (value.trim() !== text) onSave(value.trim());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setValue(text);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`border-b-2 border-blue-500 outline-none ${className}`}
        />
        <button onMouseDown={(e) => e.preventDefault()} onClick={handleSave}>
          ✓
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setValue(text);
            setIsEditing(false);
          }}
        >
          ✗
        </button>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer hover:underline ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {text || placeholder}
    </div>
  );
};
