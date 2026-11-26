import { useState } from 'react';
import { RolePicker } from '@/components/admin/role-picker';

export default function RolePickerDemo() {
    const [roleNames, setRoleNames] = useState(['admin']);

    return (
        <div className="max-w-sm">
            <RolePicker
                roles={[
                    { name: 'super-admin', label: 'Super Admin' },
                    {
                        name: 'admin',
                        label: 'Admin',
                        description: 'Manages users and settings.',
                    },
                    { name: 'reader', label: 'Reader' },
                ]}
                value={roleNames}
                onChange={setRoleNames}
            />
        </div>
    );
}
