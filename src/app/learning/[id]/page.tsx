import { CURRICULUM_DATA } from '@/constants/curriculum';
import LearningContent from './LearningContent';

export async function generateStaticParams() {
    return CURRICULUM_DATA.map((item) => ({
        id: item.order_no.toString(),
    }));
}

export default function LearningPage() {
    return <LearningContent />;
}
