
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

    const handleToggleDisable = (mode: Mode, index: number) => {
        const newChallenges = JSON.parse(JSON.stringify(challenges));
        const currentText = newChallenges[selectedLevel][mode][index];
        
        if (currentText.trim().startsWith('//')) {
            // Enable: remove the leading // and optional space
            newChallenges[selectedLevel][mode][index] = currentText.replace(/^\/\/\s*/, '');
        } else {
            // Disable: add // prefix
            newChallenges[selectedLevel][mode][index] = '// ' + currentText;
        }
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
                                        {challenges[selectedLevel]?.[mode]?.map((text, index) => {
                                            const isDisabled = text.trim().startsWith('//');
                                            return (
                                                <li key={`${mode}-${index}`} className={`flex items-center justify-between bg-gray-700 p-2 rounded group border border-transparent ${isDisabled ? 'border-gray-500 bg-gray-800' : 'hover:border-purple-500/50'}`}>
                                                    <span className={`text-sm flex-1 break-all ${isDisabled ? 'opacity-40 line-through text-gray-400' : ''}`}>{text}</span>
                                                    
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleToggleDisable(mode, index)}
                                                            className={`p-1.5 rounded transition-colors ${isDisabled ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-yellow-400 hover:bg-gray-600'}`}
                                                            title={isDisabled ? "启用" : "禁用 (暂时不抽到)"}
                                                        >
                                                            {isDisabled ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                                                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                  <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-5.533.75.75 0 000-.884A10.004 10.004 0 0010 3c-2.905 0-5.52.895-7.635 2.417L3.28 2.22zm7.653 7.653l1.528 1.528A2.5 2.5 0 0110 12.5a2.5 2.5 0 01-1.433-.453l1.528 1.528a4 4 0 002.558-2.558zM12.984 9.043l1.248 1.249a4.004 4.004 0 00-1.248-1.249z" clipRule="evenodd" />
                                                                  <path d="M5.42 6.48l1.096 1.096A4 4 0 0110 7.5a4 4 0 012.35 1.134l.87.87A10.019 10.019 0 0010 5.5c-2.288 0-4.381.72-6.105 1.956.177.37.38.717.604 1.024zM3.46 8.44A10.076 10.076 0 013.25 10c0 .762.115 1.5.328 2.202l1.654-1.654a10.02 10.02 0 01-1.772-2.108zM11.956 16.485l-1.85-1.85A4.003 4.003 0 0110 15a4 4 0 01-2.023-.55l-1.09 1.09A10.019 10.019 0 0010 17c1.71 0 3.32-.477 4.707-1.303-.263-.26-.516-.53-.751-.812z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(mode, index)} 
                                                            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors"
                                                            title="永久删除"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        }) ?? (<li>No challenges found.</li>)}
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
