import React from "react";
import { FaStar } from "react-icons/fa6";
import { FaRegStar } from "react-icons/fa";

const ReviewCard = ({ text, name, image, rating, role }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 max-w-sm w-full">
      <div className="flex items-center mb-3 text-blue-400 text-sm">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <span key={i}>{i < rating ? <FaStar /> : <FaRegStar />}</span>
          ))}
      </div>

      <p className="text-gray-700 text-sm mb-5">{text}</p>

      <div className="flex items-center gap-3">
        {image ? (
          <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-semibold">
            {(name || "L").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">{name}</h4>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
