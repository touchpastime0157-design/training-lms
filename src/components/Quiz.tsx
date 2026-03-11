'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface Question {
    id: string;
    question: string;
    options: string[];
    answer: number;
}

interface QuizProps {
    questions: Question[];
    onFinish: (score: number, passed: boolean) => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onFinish }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [showResult, setShowResult] = useState(false);

    const handleSelect = (idx: number) => {
        const newAnswers = [...answers];
        newAnswers[currentIdx] = idx;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            calculateResult();
        }
    };

    const calculateResult = () => {
        let score = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.answer) {
                score += 20; // 5 questions, 20 points each
            }
        });
        const passed = score >= 80;
        setShowResult(true);
        onFinish(score, passed);
    };

    if (showResult) {
        const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 20 : 0), 0);
        const passed = score >= 80;

        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md mx-auto text-center border border-gray-100">
                {passed ? (
                    <div className="mb-6 inline-flex p-4 bg-green-50 rounded-full">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </div>
                ) : (
                    <div className="mb-6 inline-flex p-4 bg-red-50 rounded-full">
                        <XCircle className="w-16 h-16 text-red-500" />
                    </div>
                )}
                <h2 className="text-3xl font-bold mb-2">{passed ? '合格！' : '不合格'}</h2>
                <p className="text-gray-500 text-lg mb-6">スコア: {score} / 100</p>
                {!passed && (
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                    >
                        再挑戦
                    </button>
                )}
            </div>
        );
    }

    const q = questions[currentIdx];

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    第 {currentIdx + 1} 問 / 全 {questions.length} 問
                </span>
                <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            <h2 className="text-xl font-bold mb-8 text-gray-800 leading-relaxed">{q.question}</h2>

            <div className="space-y-4 mb-8">
                {q.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleSelect(i)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${answers[currentIdx] === i
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 bg-white'
                            }`}
                    >
                        <div className="flex items-center">
                            <span className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center text-xs ${answers[currentIdx] === i ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300'
                                }`}>
                                {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                        </div>
                    </button>
                ))}
            </div>

            <button
                disabled={answers[currentIdx] === undefined}
                onClick={handleNext}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition shadow-lg ${answers[currentIdx] === undefined
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                    }`}
            >
                {currentIdx < questions.length - 1 ? '次へ' : '結果を確認'}
                <ChevronRight className="ml-2 w-5 h-5" />
            </button>
        </div>
    );
};
