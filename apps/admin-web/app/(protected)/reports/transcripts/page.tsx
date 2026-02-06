'use client';

import { useState } from 'react';
import { GraduationCap, Lock, Search, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { reportsClient } from '@school-erp/api-client';

export default function TranscriptsPage() {
    const [studentId, setStudentId] = useState('');
    const [searchId, setSearchId] = useState('');

    const { data: transcript, isLoading, isError } = useQuery(
        () => reportsClient.transcripts.get(searchId),
        { enabled: !!searchId }
    );

    const handleSearch = () => { if (studentId.trim()) setSearchId(studentId.trim()); };

    return (
        <WithFeature flag="reports.enabled">
            <PageContent>
                <PageHeader title="Transcripts" subtitle="View student academic history (read-only)" />
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-blue-600" /><p className="text-sm text-blue-700">Transcripts are read-only records of academic history.</p></div>
                </Card>
                <Card title="Search Student">
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Student ID or Roll Number</label>
                            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Enter student ID" className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none" />
                        </div>
                        <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" />Search</Button>
                    </div>
                </Card>

                {searchId && (
                    <>
                        {isLoading && <PageLoader />}
                        {isError && <Card><p className="text-gray-500">Student not found or no transcript available</p></Card>}
                        {transcript && (
                            <>
                                <Card title="Student Information">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="flex items-start gap-3"><User className="mt-1 h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{transcript.student?.name}</p></div></div>
                                        <div><p className="text-sm text-gray-500">Roll Number</p><p className="font-medium">{transcript.student?.rollNumber ?? '—'}</p></div>
                                        <div><p className="text-sm text-gray-500">Admission Year</p><p className="font-medium">{transcript.student?.admissionYear ?? '—'}</p></div>
                                        <div><p className="text-sm text-gray-500">Current Class</p><p className="font-medium">{transcript.currentClass ?? '—'}</p></div>
                                    </div>
                                </Card>
                                <Card title="Academic History">
                                    {transcript.history && transcript.history.length > 0 ? (
                                        <div className="space-y-4">
                                            {transcript.history.map((year: { academicYear: string; class: string; percentage: number; grade: string; status: string }, idx: number) => (
                                                <div key={idx} className="rounded-lg border border-gray-200 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <GraduationCap className="h-5 w-5 text-primary-500" />
                                                            <div><p className="font-medium">{year.academicYear}</p><p className="text-sm text-gray-500">{year.class}</p></div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span>{year.percentage}%</span>
                                                            <Badge variant="info">{year.grade}</Badge>
                                                            <Badge variant={year.status === 'passed' ? 'success' : 'error'}>{year.status}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-gray-500">No academic history available</p>}
                                </Card>
                            </>
                        )}
                    </>
                )}
            </PageContent>
        </WithFeature>
    );
}
