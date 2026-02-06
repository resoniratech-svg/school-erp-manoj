'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, FileText, User, Award } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { reportsClient } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning'> = { draft: 'default', published: 'success', pending: 'warning' };

interface PageProps { params: { id: string }; }

export default function ReportCardDetailPage({ params }: PageProps) {
    const router = useRouter();
    const { data: report, isLoading, isError, refetch } = useQuery(() => reportsClient.reportCards.get(params.id));

    if (isLoading) return <PageLoader />;
    if (isError || !report) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="reports.enabled">
            <PageContent>
                <PageHeader title="Report Card" subtitle={`${report.student?.name ?? 'Student'}`} actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-blue-600" /><p className="text-sm text-blue-700">This report is read-only.</p></div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary-500" />
                        <Badge variant={STATUS_VARIANTS[report.status] ?? 'default'}>{report.status}</Badge>
                    </div>
                </Card>
                <Card title="Student Information">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start gap-3"><User className="mt-1 h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{report.student?.name}</p></div></div>
                        <div><p className="text-sm text-gray-500">Class</p><p className="font-medium">{report.class?.name} - {report.section?.name ?? ''}</p></div>
                        <div><p className="text-sm text-gray-500">Exam</p><p className="font-medium">{report.exam?.name}</p></div>
                        <div><p className="text-sm text-gray-500">Roll Number</p><p className="font-medium">{report.student?.rollNumber ?? '—'}</p></div>
                    </div>
                </Card>
                <Card title="Subject-wise Marks">
                    {report.subjects && report.subjects.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {report.subjects.map((s: { subjectId: string; subjectName: string; marks: number; maxMarks: number; grade: string }) => (
                                <div key={s.subjectId} className="flex items-center justify-between py-3">
                                    <span className="font-medium">{s.subjectName}</span>
                                    <div className="flex items-center gap-4">
                                        <span>{s.marks} / {s.maxMarks}</span>
                                        <Badge variant="info">{s.grade}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500">No subject data available</p>}
                </Card>
                {report.totalMarks !== undefined && (
                    <Card title="Summary">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="text-center"><p className="text-sm text-gray-500">Total Marks</p><p className="text-2xl font-bold">{report.totalMarks} / {report.maxTotalMarks}</p></div>
                            <div className="text-center"><p className="text-sm text-gray-500">Percentage</p><p className="text-2xl font-bold">{report.percentage}%</p></div>
                            <div className="text-center"><p className="text-sm text-gray-500">Grade</p><div className="flex justify-center mt-1"><Badge variant="success" className="text-lg px-4 py-2">{report.grade}</Badge></div></div>
                        </div>
                    </Card>
                )}
            </PageContent>
        </WithFeature>
    );
}
