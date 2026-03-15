import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Dropdown, Transition, Segment, Icon, DropdownProps, DropdownItemProps } from 'semantic-ui-react'
import OptionTable from '../lib/optionTable';
import fuzzysort from 'fuzzysort';
import { FetchPageContext, PageContext, Copy } from '../lib/messages';

const storage = browser.storage.local;

interface Option {
    key: string
    text: string
    value: string
    content: JSX.Element
}

export const Popup: React.FC = () => {

    const [selecting, setSelecting] = useState<boolean>(true);
    const [copyTemplates, setCopyTemplates] = useState<Option[]>([]);
    const dropdownRef = useRef<any>(null);
    const [selectedValue, setSelectedValue] = useState<string>('');

    const onChangedSelection = useCallback((e, { value }) => {
        setSelectedValue(value);
    }, []);

    const onComplete = useCallback(async (e) => {
        await browser.runtime.sendMessage(new Copy(selectedValue));
        setSelecting(false);
        setTimeout(() => window.close(), 1000);
    }, [selectedValue]);

    useEffect(() => {
        (async () => {
            if (dropdownRef.current === null) {
                throw new Error('Dropdown ref is not available');
            }
            console.log(dropdownRef.current.ref.current);
            const searchQueryInputElement: HTMLElement = dropdownRef.current.ref.current.querySelector('input');
            searchQueryInputElement.focus();
            searchQueryInputElement.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    window.close();
                }
            });
            const response: Promise<PageContext> = browser.runtime.sendMessage(new FetchPageContext());
            const option = storage.get('option').then(d => OptionTable.deserialize(d.option));
            const contextType = (await response).contextType;
            const templates = (await option).templates;
            setCopyTemplates(
                templates
                    .filter(v => v.enableContexts.includes(contextType))
                    .map((v, i) => {
                        return { key: v.id, text: v.name, value: v.id, content: (<span>{v.name}</span>) };
                    })
            );
            setSelectedValue(templates.length > 0 ? templates[0].id : '');
        })();
    }, []);

    const fuzzySearch = (options: DropdownItemProps[], query: string) => {
        return fuzzysort.go(query, options, {key: 'text'}).map(result => {
            const highlighted: JSX.Element[] =
                Array.from(result.target).map((char, index) => {
                    if (result.indexes.includes(index)) {
                        return (<b>{char}</b>)
                    } else {
                        return (<span>{char}</span>)
                    }
                });
            return Object.assign({}, result.obj, {
                content: highlighted
            }) as DropdownItemProps;
        });
    };

    return (
        <div>
            {
                selecting
                ?
                    <Dropdown
                        ref={dropdownRef}
                        icon=''
                        fluid
                        defaultOpen
                        search={fuzzySearch}
                        selection
                        options={copyTemplates}
                        onChange={onChangedSelection}
                        onClose={onComplete}
                        value={selectedValue}
                    />
                : <div />
            }
            <Transition visible={!selecting} animation='slide down' duration={100}>
                <Segment textAlign='left' vertical style={{ 'margin-left': '1rem' }}>
                    <Icon name='check' size='big' color='green' />
                    <span>{selecting ? '' : copyTemplates.find(t => t.value === selectedValue)?.text}</span>
                </Segment>
            </Transition>
        </div>
    );
};
