import React, { useMemo } from "react";
import ReviewCard from "./ReviewCard";
import { useSelector } from "react-redux";

function ReviewPage() {
  const { allReview } = useSelector((state) => state.review);

  const latestReview = useMemo(() => {
    return (allReview || []).slice(0, 6);
  }, [allReview]);

  return (
    <section className="flex items-center justify-center flex-col px-4">
      <h1 className="md:text-[45px] text-[30px] font-semibold text-center mt-[30px]">
        Real Reviews from Real Learners
      </h1>
      <span className="lg:w-[50%] md:w-[80%] text-[15px] text-center mt-[20px] mb-[30px]">
        Genuine feedback from students preparing for boards and competitive exams.
      </span>

      <div className="w-full min-h-[50vh] flex items-center justify-center flex-wrap gap-[24px] lg:p-[30px] md:p-[20px] p-[10px] mb-[30px]">
        {latestReview.map((item) => (
          <ReviewCard
            key={item._id}
            rating={item.rating}
            image={item.user?.photoUrl || ""}
            text={item.comment}
            name={item.user?.name || "Learner"}
            role={item.user?.role || "student"}
          />
        ))}
      </div>
    </section>
  );
}

export default ReviewPage;
