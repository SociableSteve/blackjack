import { Player } from "./App";
import PlayerComponent from "./Player";

interface Props {
  player: Player;
}

const Dealer = (props: Props) => {
  return (
    <div className="dealer">
      <PlayerComponent {...props} hide={props.player.status === "waiting"} />
    </div>
  );
};

export default Dealer;
