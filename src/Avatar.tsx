const Avatar = ({
  name,
  url,
  score,
  timer,
  hide,
}: {
  name: string;
  url: string;
  score: number[];
  timer: number;
  hide?: boolean;
}) => {
  return (
    <div className="player-avatar">
      <svg
        className="timer-progress"
        width="100"
        height="100"
        viewBox="0 0 100 100"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle r="37" cx="40" cy="40" stroke="white"></circle>
        <circle
          r="37"
          cx="40"
          cy="40"
          stroke="green"
          strokeDasharray={2 * Math.PI * 38}
          strokeDashoffset={((30 - timer) / 30) * (2 * Math.PI * 38)}
          strokeWidth={3}
        ></circle>
      </svg>
      <img src={url} alt={`Avatar for ${name}`} className="profile-pic" />
      {hide !== true ? <div className="score">{score.join(" / ")}</div> : null}
    </div>
  );
};

export default Avatar;

// select child.name, parent.name from table as child left join table as parent on (child.parent_id = parent.id) order by child.parent_id
