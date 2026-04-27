import { useEffect, useState } from "react";

function Timer({ durationMinutes = 60, onComplete }) {
  const totalSeconds = durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onComplete) onComplete();
      return;
    }

    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [secondsLeft, onComplete]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-800">
      <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
      Time Remaining
      <span className="font-semibold tabular-nums">
        {minutes}:{seconds}
      </span>
    </div>
  );
}

export default Timer;

