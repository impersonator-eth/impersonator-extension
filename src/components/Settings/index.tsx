import Chains from "./Chains";

function Settings({ close }: { close: () => void }) {
  return (
    <>
      <Chains close={close} />
    </>
  );
}

export default Settings;
