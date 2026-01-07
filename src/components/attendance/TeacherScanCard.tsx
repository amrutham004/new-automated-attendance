import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherScanCard = () => {
  return (
    <Card className="p-6 card-shadow">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg gradient-primary text-primary-foreground">
          <ScanLine size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold font-display mb-1">Scan Student Attendance</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Scan student QR codes to record their attendance. Each code expires in 30 seconds.
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/scan-student" className="flex items-center gap-2">
              <ScanLine size={16} />
              Start Scanning
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TeacherScanCard;
