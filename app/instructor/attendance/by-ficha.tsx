import AttendanceByFichaScreen from "../../admin/attendance/by-ficha";

export default function InstructorAttendanceByFichaScreen({ allowedFichaIds }: { allowedFichaIds?: string[] }) {
  return <AttendanceByFichaScreen directFichaOnly allowedFichaIds={allowedFichaIds} />;
}
