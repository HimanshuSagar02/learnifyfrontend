import React, { useMemo } from "react";
import Card from "./Card.jsx";
import { useSelector } from "react-redux";
import { SiViaplay } from "react-icons/si";
import { useNavigate } from "react-router-dom";

function Cardspage() {
  const { courseData } = useSelector((state) => state.course);
  const navigate = useNavigate();

  const popularCourses = useMemo(() => {
    return (courseData || []).slice(0, 6);
  }, [courseData]);

  return (
    <section className="relative flex items-center justify-center flex-col px-4">
      <h1 className="md:text-[45px] text-[30px] font-semibold text-center mt-[30px]">Our Popular Tech Courses</h1>
      <span className="lg:w-[50%] md:w-[80%] text-[15px] text-center mt-[20px] mb-[30px]">
        Top rated technical courses curated for practical skill building and career growth.
      </span>

      <div className="w-full min-h-[60vh] flex items-center justify-center flex-wrap gap-[30px] lg:p-[30px] md:p-[20px] p-[10px] mb-[40px]">
        {popularCourses.map((item) => (
          <Card
            key={item._id}
            id={item._id}
            thumbnail={item.thumbnail}
            title={item.title}
            price={item.price}
            category={item.category}
            reviews={item.reviews}
            class={item.class}
            subject={item.subject}
          />
        ))}
      </div>

      <button
        className="px-[20px] py-[10px] border-2 border-[#3B82F6] bg-black text-[#3B82F6] rounded-[10px] text-[16px] font-semibold flex gap-2 cursor-pointer hover:bg-[#3B82F6] hover:text-black transition-all"
        onClick={() => navigate("/allcourses")}
      >
        View All Tech Courses{" "}
        <SiViaplay className="w-[24px] h-[24px] fill-current" />
      </button>
    </section>
  );
}

export default Cardspage;
