import { useState, useEffect } from 'react';
import { Crown, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../services/api';
import Loader from '../../components/Loader';

const SubscriptionsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/analytics/subscriptions');
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const togglePlan = async (user) => {
    const newPlan = user.subscriptionPlan === 'pro' ? 'free' : 'pro';
    try {
      await API.put(`/analytics/subscription/${user._id}`, { plan: newPlan });
      toast.success(`${user.name} upgraded to ${newPlan.toUpperCase()}`);
      fetchUsers();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const proCount = users.filter((u) => u.subscriptionPlan === 'pro').length;
  const freeCount = users.filter((u) => u.subscriptionPlan === 'free').length;
  const simulatedMRR = proCount * 20;

  if (loading) return <Loader text="Loading subscriptions..." />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Subscription Management</h1>
        <p className="text-slate-500 text-sm">Manage user subscription plans (simulated billing)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Pro Users</p>
            <p className="text-2xl font-bold">{proCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-400 rounded-lg flex items-center justify-center text-white font-bold">F</div>
          <div>
            <p className="text-sm text-slate-500">Free Users</p>
            <p className="text-2xl font-bold">{freeCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">$</div>
          <div>
            <p className="text-sm text-slate-500">Monthly Revenue (sim)</p>
            <p className="text-2xl font-bold">${simulatedMRR}</p>
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card border-2 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Free Plan</h3>
            <span className="text-2xl font-bold">$0</span>
          </div>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic patient management</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Appointment booking</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Prescription writing</li>
            <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-500" /> No AI features</li>
            <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-500" /> No advanced analytics</li>
          </ul>
        </div>
        <div className="card border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold flex items-center gap-1">
              <Crown className="w-5 h-5 text-amber-500" /> Pro Plan
            </h3>
            <span className="text-2xl font-bold">$20<span className="text-sm text-slate-500">/mo</span></span>
          </div>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Everything in Free</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> AI Symptom Checker</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> AI Risk Flagging</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> AI Prescription Explanations</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Advanced Analytics</li>
          </ul>
        </div>
      </div>

      {/* User list */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Plan</th>
                <th className="text-right text-xs font-semibold text-slate-600 uppercase px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-sm">{u.role}</td>
                  <td className="px-4 py-3">
                    {u.subscriptionPlan === 'pro' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        <Crown className="w-3 h-3" /> Pro
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => togglePlan(u)}
                      className={`px-3 py-1 text-xs rounded-lg ${
                        u.subscriptionPlan === 'pro'
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {u.subscriptionPlan === 'pro' ? 'Downgrade' : 'Upgrade to Pro'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
