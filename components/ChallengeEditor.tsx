
import React, { useState, useEffect, useRef } from 'react';
import { getChallenges, saveChallenges, resetChallenges } from '../services/geminiService';
import type { Level, Mode } from '../types';
import { LEVEL_DETAILS } from '../types';

const ChallengeEditor: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [challenges, setChallenges] = useState(() => getChallenges());
    const [selectedLevel, setSelectedLevel] = useState<Level>('gentle');
    const [newChallengeText, setNewChallengeText] = useState<Record<Mode, string>>({ truth: '', dare: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleSaveAndClose = () => {
        saveChallenges(challenges);
        onClose();
    };

    const handleDelete = (mode: Mode, index: number) => {
        const newChallenges = JSON.parse(JSON.stringify(challenges));
        newChallenges[selectedLevel][mode].splice(index, 1);
        setChallenges(newChallenges);
    };

    const handleAdd = (mode: Mode) => {
        const text = newChallengeText[mode].trim();
        if (text) {
            const newChallenges = JSON.parse(JSON.stringify(challenges));
            newChallenges[selectedLevel][mode].push(text);
            setChallenges(newChallenges);
            setNewChallengeText(prev => ({ ...prev, [mode]: '' }));
        }
    };
    
    const handleInputChange = (mode: Mode, value: string) => {
        setNewChallengeText(prev => ({ ...prev, [mode]: value }));
    };

    const handleResetToDefaults = () => {
        if (window.confirm('你确定要将所有问题重置为默认设置吗？你自定义的内容将会丢失。')) {
            const newDefaultChallenges = resetChallenges();
            setChallenges(newDefaultChallenges);
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(challenges, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'truth-or-dare-challenges.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not valid text");
                
                const importedChallenges = JSON.parse(text);

                // Basic validation
                if (
                    !importedChallenges.gentle?.truth ||
                    !importedChallenges.warming?.dare ||
                    !importedChallenges.intimate
                ) {
                    throw new Error("Invalid challenge file structure.");
                }

                setChallenges(importedChallenges);
                alert('题库导入成功！');
            } catch (error) {
                console.error("Failed to import challenges:", error);
                alert('导入失败！请确保文件格式正确。');
            }
        };
        reader.readAsText(file);
        // Reset file input value to allow re-importing the same file
        event.target.value = '';
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
            <div className="bg-gray-800 text-white w-full max-w-5xl h-[90vh] rounded-lg shadow-xl flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-2xl font-bold">问题编辑器</h2>
                    <div className="flex items-center gap-2">
                        <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} />
                        <button onClick={handleImportClick} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-sm font-semibold">导入</button>
                        <button onClick={handleExport} className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-sm font-semibold">导出</button>
                        <button 
                            onClick={handleResetToDefaults} 
                            className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors text-sm font-semibold"
                            title="将所有问题恢复到初始状态"
                        >
                            恢复默认
                        </button>
                        <button onClick={handleSaveAndClose} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors font-semibold">
                            保存并关闭
                        </button>
                    </div>
                </header>
                <div className="flex flex-grow overflow-hidden">
                    <nav className="w-1/4 border-r border-gray-700 p-4">
                        <h3 className="text-lg font-semibold mb-4 text-white/80">级别</h3>
                        <ul className="space-y-1">
                            {(Object.keys(LEVEL_DETAILS) as Level[]).map(levelKey => (
                                <li key={levelKey}>
                                    <button
                                        onClick={() => setSelectedLevel(levelKey)}
                                        className={`w-full text-left p-2 rounded-md transition-colors ${selectedLevel === levelKey ? 'bg-purple-500/30 text-white' : 'text-white/60 hover:bg-gray-700'}`}
                                    >
                                        {LEVEL_DETAILS[levelKey].name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <main className="w-3/4 flex-grow p-4 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(['truth', 'dare'] as Mode[]).map(mode => (
                                <div key={mode} className="bg-gray-900 p-4 rounded-lg flex flex-col">
                                    <h4 className="text-xl font-bold mb-3 capitalize text-center text-purple-300">{mode === 'truth' ? '真心话' : '大冒险'}</h4>
                                    <ul className="space-y-2 mb-4 h-96 overflow-y-auto pr-2 flex-grow">
                                        {challenges[selectedLevel]?.[mode]?.map((text, index) => (
                                            <li key={`${mode}-${index}`} className="flex items-center justify-between bg-gray-700 p-2 rounded group">
                                                <span className="text-sm flex-1 break-all">{text}</span>
                                                <button onClick={() => handleDelete(mode, index)} className="text-red-500 hover:text-red-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xl">&times;</button>
                                            </li>
                                        )) ?? (<li>No challenges found.</li>)}
                                    </ul>
                                    <div className="flex gap-2 mt-auto">
                                        <input
                                            type="text"
                                            value={newChallengeText[mode]}
                                            onChange={(e) => handleInputChange(mode, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAdd(mode)}
                                            placeholder="新增问题..."
                                            className="flex-grow bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button onClick={() => handleAdd(mode)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded">添加</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ChallengeEditor;
