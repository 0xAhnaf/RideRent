import AdminDriversPage from "../../../pages/AdminDriversPage";
import { AMBULANCE_API } from "./ambulanceApi";

function AmbulanceDriversSection({ onChanged }) {
  return <AdminDriversPage apiUrl={`${AMBULANCE_API}/drivers`} embedded onChanged={onChanged} />;
}

export default AmbulanceDriversSection;
