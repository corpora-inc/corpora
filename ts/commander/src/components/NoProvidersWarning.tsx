import { AlertTriangle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/SettingsDialog";

export function NoProvidersWarning() {
    return (
        <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
                <div className="flex items-center justify-between">
                    <div>
                        <strong>No AI providers configured.</strong> You'll need to set up at least one AI provider to use AI features like drafting and rewriting.
                    </div>
                    <SettingsDialog 
                        trigger={
                            <Button size="sm" variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100">
                                <Settings className="h-4 w-4 mr-1" />
                                Configure
                            </Button>
                        }
                    />
                </div>
            </AlertDescription>
        </Alert>
    );
}
