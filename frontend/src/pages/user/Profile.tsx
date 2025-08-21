import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateProfile, getRoleNames, hasRole } = useAuth();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await updateProfile(data.name);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset({ name: user?.name || '' });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }


  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-black text-white';
      case 'vendor':
        return 'bg-gray-800 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-black mb-8">Profile</h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-black">
                        Full Name
                      </label>
                      <Input
                        {...form.register('name')}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        disabled={isLoading}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-black">{user.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-black">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <div className="flex flex-wrap gap-1">
                          {getRoleNames().map((roleName, index) => (
                            <span
                              key={index}
                              className={`inline-block px-2 py-1 rounded text-sm font-medium capitalize ${getRoleBadgeColor(roleName)}`}
                            >
                              {roleName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Member since</p>
                        <p className="font-medium text-black">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-black font-medium">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {hasRole('customer') && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Orders</span>
                        <span className="text-black font-medium">-</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Spent</span>
                        <span className="text-black font-medium">-</span>
                      </div>
                    </>
                  )}

                  {hasRole('vendor') && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Products Listed</span>
                        <span className="text-black font-medium">-</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Sales</span>
                        <span className="text-black font-medium">-</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-gray-200 mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {hasRole('customer') && (
                  <>
                    <Button 
                      asChild
                      variant="outline"
                      className="border-black text-black hover:bg-gray-50"
                    >
                      <a href="/orders">View Orders</a>
                    </Button>
                    <Button 
                      asChild
                      variant="outline"
                      className="border-black text-black hover:bg-gray-50"
                    >
                      <a href="/cart">View Cart</a>
                    </Button>
                  </>
                )}
                
                {hasRole('vendor') && (
                  <>
                    <Button 
                      asChild
                      variant="outline"
                      className="border-black text-black hover:bg-gray-50"
                    >
                      <a href="/vendor">Vendor Dashboard</a>
                    </Button>
                    <Button 
                      asChild
                      variant="outline"
                      className="border-black text-black hover:bg-gray-50"
                    >
                      <a href="/vendor/products">Manage Products</a>
                    </Button>
                  </>
                )}
                
                {hasRole('admin') && (
                  <Button 
                    asChild
                    variant="outline"
                    className="border-black text-black hover:bg-gray-50"
                  >
                    <a href="/admin">Admin Dashboard</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}