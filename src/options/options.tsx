import React, { useState, useRef, useEffect, RefObject, useCallback } from 'react';
import { Template, TemplateRef } from './template';
import { Template as TemplateState } from '../lib/template'
import { Icon, Form, Button, Card, Segment } from 'semantic-ui-react'
import { OptionSaved } from '../lib/messages';
import OptionTable from '../lib/optionTable';

import './options.css'

export default function Options() {
    const storage = browser.storage.local;

    const [templates, updateTemplates] = useState(new Array<JSX.Element>());
    const [saved, setSaved] = useState(false);

    const templateRef = useRef(new Map<string, RefObject<TemplateRef>>());

    const removeTemplate = useCallback((templateState: TemplateState) => {
        templateRef.current.delete(templateState.id);
        updateTemplates(current => current.filter(t => t.key !== templateState.id));
    }, []);

    useEffect(() => {
        (async () => {
            const option = await storage.get('option').then(d => OptionTable.deserialize(d.option));
            if (option.templates) {
                const templates =
                    option.templates.map(t => {
                        const ref = React.createRef<TemplateRef>();
                        templateRef.current.set(t.id, ref);
                        return <Template ref={ref} key={t.id} state={t} onRemove={removeTemplate} />;
                    });
                updateTemplates(current => current.concat(templates));
            }
        })();
    }, []);

    const addNewTemplate = useCallback(() => {
        const newTemplateState = TemplateState.empty();
        const ref = React.createRef<TemplateRef>();
        templateRef.current.set(newTemplateState.id, ref);
        updateTemplates(current => current.concat(<Template isNew ref={ref} key={newTemplateState.id} state={newTemplateState} onRemove={removeTemplate} />));
    }, []);

    const save = useCallback(async () => {
        const templates =
            Array.from(templateRef.current.values())
                .reduce<TemplateState[]>((acc, ref) => {
                    if (ref.current) {
                        acc.push(ref.current.template());
                    }
                    return acc;
                }, [])
                .filter(t => t.name.trim() !== '' && t.enableContexts.length !== 0);
        await storage.set({'option': new OptionTable(templates)});
        await browser.runtime.sendMessage(new OptionSaved());
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }, []);

    return (
        <div>
            <div className='controls'>
                <Segment textAlign='right'>
                    <Button className='control' icon size='small' onClick={addNewTemplate}>
                        <Icon name='plus' />
                        Add template
                    </Button>
                    <Button className='control' icon size='small' onClick={save}>
                        <Icon name={saved ? 'checkmark' : 'download'} />
                        Save
                    </Button>
                </Segment>
            </div>
            <Form className='option-form' size='small'>
                <Card.Group centered>
                    {templates}
                </Card.Group>
                <div className='control'>
                </div>
            </Form>
        </div>
    );
}
