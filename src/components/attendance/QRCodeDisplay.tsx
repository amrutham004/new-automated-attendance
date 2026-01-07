import { Card } from '@/components/ui/card';
import { getDailyToken } from '@/lib/attendanceData';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  showForAdmin?: boolean;
}

const QRCodeDisplay = ({ showForAdmin = false }: QRCodeDisplayProps) => {
  const token = getDailyToken();

  return (
    <Card className="p-6 card-shadow text-center">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold font-display">
          {showForAdmin ? "Today's Attendance QR Code" : "Scan to Mark Attendance"}
        </h3>
        
        {/* Real QR Code */}
        <div className="mx-auto w-48 h-48 bg-white rounded-xl flex items-center justify-center p-3 border border-border">
          <QRCodeSVG 
            value={token}
            size={168}
            level="H"
            includeMargin={false}
            bgColor="transparent"
            fgColor="hsl(200, 25%, 15%)"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {showForAdmin 
            ? "Display this QR code for students to scan. Changes daily."
            : "Point your camera at the QR code displayed in class"
          }
        </p>
      </div>
    </Card>
  );
};

export default QRCodeDisplay;
