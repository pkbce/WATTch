
'use client';

import { useState, useRef, useEffect } from 'react';
import { Socket } from './dashboard-client';
import { Input } from './ui/input';

interface EditableSocketNameProps {
  socket: Socket;
  onUpdateSocketName: (socketId: string, newName: string) => void;
}

export function EditableSocketName({ socket, onUpdateSocketName }: EditableSocketNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(socket.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(socket.name);
  }, [socket.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newName = name.trim().slice(0, 24);
    if (newName !== '') {
      onUpdateSocketName(socket.id, newName);
      setName(newName);
    } else {
      setName(socket.name); // Revert if the name is empty
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.slice(0, 24));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setName(socket.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={name}
        onChange={handleChange}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-sm font-semibold h-7 max-w-[200px]"
        maxLength={24}
      />
    );
  }

  return (
    <h3
      className="text-sm font-semibold cursor-pointer hover:bg-muted rounded-md px-2 py-1 truncate max-w-[200px]"
      onClick={() => setIsEditing(true)}
      title={socket.name}
    >
      {socket.name}
    </h3>
  );
}
