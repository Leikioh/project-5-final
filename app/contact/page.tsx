"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h1 className="text-4xl font-bold text-gray-900">Hello, what&apos;s on your mind ? </h1>
            <p className="text-gray-700">Credibly administrate market positioning dliverables rather than clicks-and-mortar methodologies. 
              Proactively formulate out-of-the-box technology with clicks-and-mortar testing procedures. 
              Uniquely promote leveraged web-readiness for standards compliant value. Rapidiously pontificate cooperative mindshare via maintainable applications.</p>
              <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Schedule a call
            </button>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-orange-500 shadow-md rounded-xl p-8">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-lg border text-black border-white focus:outline-orange-500"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              className="w-full px-4 py-3 rounded-lg border text-black border-white focus:outline-orange-500"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              className="w-full px-4 py-3 rounded-lg border text-black border-white focus:outline-orange-500"
              value={formData.subject}
              onChange={handleChange}
              required
            />
            <textarea
              name="message"
              rows={5}
              placeholder="Your Message"
              className="w-full px-4 py-3 rounded-lg border text-black border-white focus:outline-orange-500"
              value={formData.message}
              onChange={handleChange}
              required
            />
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </main>
    </>
  );
}