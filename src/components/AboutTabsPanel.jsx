import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaExternalLinkAlt, FaUserCircle, FaUsers } from "react-icons/fa";
import { serverUrl } from "../App";

const defaultContent = {
  aboutProject: {
    badgeTitle: "About Project",
    headline: "We Help You Build Technical Mastery",
    subheadline: "A practical learning platform for developers and engineers",
    description:
      "We provide a modern technical learning platform focused on practical skills, project execution, and mentor-guided growth.",
    highlights: [
      "Project-Based Learning",
      "Industry Mentors",
      "Career-Focused Paths",
      "Lifetime Access",
    ],
    imageUrl: "",
    isActive: true,
  },
  teamMembers: [],
};

function AboutTabsPanel() {
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const fetchMarketingContent = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${serverUrl}/api/marketing/public`, { withCredentials: true });
        const data = res.data || {};
        setContent({
          aboutProject: {
            ...defaultContent.aboutProject,
            ...(data.aboutProject || {}),
            highlights: Array.isArray(data.aboutProject?.highlights)
              ? data.aboutProject.highlights
              : defaultContent.aboutProject.highlights,
          },
          teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
        });
      } catch {
        setContent(defaultContent);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketingContent();
  }, []);

  const activeTeamMembers = useMemo(() => {
    return (content.teamMembers || [])
      .filter((member) => member?.name && member?.isActive !== false)
      .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
  }, [content.teamMembers]);

  const about = content.aboutProject || defaultContent.aboutProject;

  return (
    <section className="w-full px-4 md:px-8 py-5 md:py-7 bg-white">
      <div className="max-w-6xl mx-auto bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl border border-[#3B82F6]/30 shadow-sm p-4 md:p-6">
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveTab("about")}
            className={`px-4 py-2 rounded-xl text-sm md:text-base font-semibold transition-all ${
              activeTab === "about"
                ? "bg-black text-[#3B82F6] shadow-lg"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            About Project
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-xl text-sm md:text-base font-semibold transition-all ${
              activeTab === "team"
                ? "bg-black text-[#3B82F6] shadow-lg"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Our Team
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading section...</div>
        ) : activeTab === "about" ? (
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-wider text-[#3B82F6] font-semibold">
              {about.badgeTitle || "About Project"}
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
              {about.headline || defaultContent.aboutProject.headline}
            </h2>
            <p className="text-base md:text-lg text-gray-700 font-medium">
              {about.subheadline || defaultContent.aboutProject.subheadline}
            </p>
            <p className="text-sm md:text-base text-gray-600">
              {about.description || defaultContent.aboutProject.description}
            </p>
            {Array.isArray(about.highlights) && about.highlights.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                {about.highlights.map((item, idx) => (
                  <div
                    key={`${item}-${idx}`}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {activeTeamMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTeamMembers.map((member) => (
                  <div key={member._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-2">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="w-16 h-16 rounded-lg object-contain bg-gray-50 border border-gray-300 p-1"
                        />
                      ) : (
                        <FaUserCircle className="w-14 h-14 text-gray-400" />
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-sm text-[#3B82F6]">{member.role || "Team Member"}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 break-words">
                      {member.description || "Experienced professional driving this project forward."}
                    </p>
                    {member.profileLink && (
                      <a
                        href={member.profileLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#3B82F6] hover:underline"
                      >
                        View Profile <FaExternalLinkAlt className="text-xs" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 py-8 text-center flex items-center justify-center gap-2">
                <FaUsers className="text-[#3B82F6]" />
                Team details will be updated soon.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default AboutTabsPanel;
