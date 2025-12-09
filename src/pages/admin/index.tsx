import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Database, Mail, Settings, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { getServerSupabase } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/adminUtils";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = getServerSupabase(context);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirect to login if not authenticated
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  // Redirect to home if not an admin
  if (!isAdmin(session.user.email)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    totalRatings: 0
  });

  const adminTools = [
    {
      title: "User Management",
      description: "Debug authentication issues, manage user accounts, and clean up orphaned data",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500",
      actions: ["Debug Auth", "Clean Orphaned Users", "Force Signup", "Nuclear Reset"]
    },
    {
      title: "Database Tools",
      description: "View database schema, run queries, and manage data integrity",
      icon: Database,
      href: "/admin/database",
      color: "bg-green-500",
      actions: ["View Schema", "Run Queries", "Data Export", "Backup"]
    },
    {
      title: "Email Testing",
      description: "Test SMTP configuration, send test emails, and debug email delivery",
      icon: Mail,
      href: "/admin/email",
      color: "bg-purple-500",
      actions: ["SMTP Test", "Send Test Email", "Email Logs", "Templates"]
    },
    {
      title: "System Settings",
      description: "Configure application settings, feature flags, and environment variables",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-orange-500",
      actions: ["App Config", "Feature Flags", "Environment", "Logs"]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">BeanRate Admin</h1>
        </div>
        <p className="text-gray-600">
          Administrative dashboard for managing your coffee rating platform
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Users</p>
                <p className="text-2xl font-bold">{stats.pendingUsers}</p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ratings</p>
                <p className="text-2xl font-bold">{stats.totalRatings}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {adminTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card key={tool.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tool.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {tool.actions.map((action) => (
                      <Badge key={action} variant="outline" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                  <Link href={tool.href}>
                    <Button className="w-full">
                      Open {tool.title}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Debug Auth Issues
              </Button>
            </Link>
            
            <Link href="/admin/email">
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Test Email Setup
              </Button>
            </Link>
            
            <Link href="/admin/database">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                View Database
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>BeanRate Admin Dashboard • Version 1.0</p>
        <p className="mt-1">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Main Site
          </Link>
        </p>
      </div>
    </div>
  );
}
