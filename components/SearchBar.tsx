"use client";
import React from "react";
import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function SearchBar({ search, onSearchChange }: SearchBarProps) {
  return (
    <div className="w-full flex justify-between items-center bg-white shadow-md rounded-lg p-4 mt-10 max-w-7xl mx-auto">
      <input
        type="text"
        className="w-full px-4 py-2 outline-none border-none text-black"
        placeholder="Search for recipes..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button className="bg-orange-500 p-3 text-white rounded-lg">
        <FaSearch />
      </button>
    </div>
  );
}
