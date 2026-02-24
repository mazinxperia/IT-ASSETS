import React from 'react';
import { Calendar, Users, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const integrations = [
  {
    id: 'monday',
    name: 'Monday.com',
    description: 'Sync assets and tasks with Monday.com boards',
    icon: '📋',
    status: 'coming_soon'
  },
  {
    id: 'hrms',
    name: 'HRMS System',
    description: 'Automatically sync employee data from your HRMS',
    icon: '👥',
    status: 'coming_soon'
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Schedule asset maintenance and reviews',
    icon: '📅',
    status: 'planned'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications for asset transfers and updates',
    icon: '💬',
    status: 'planned'
  }
];

export function IntegrationsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect AssetFlow with your other tools
        </p>
      </div>

      <Card className="dark:border-border bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
              🚀
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-1">Integrations Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                We're working on bringing powerful integrations to AssetFlow. 
                These integrations will help you automate workflows and keep your systems in sync.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {integrations.map(integration => (
          <Card key={integration.id} className="dark:border-border" data-testid={`integration-${integration.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold">{integration.name}</h3>
                      <Badge variant={integration.status === 'coming_soon' ? 'secondary' : 'outline'}>
                        {integration.status === 'coming_soon' ? 'Coming Soon' : 'Planned'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="dark:border-border">
        <CardHeader>
          <CardTitle className="text-base">Request an Integration</CardTitle>
          <CardDescription>
            Need an integration that's not listed? Let us know!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <ExternalLink className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
