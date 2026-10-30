import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import VM from '@scratch/scratch-vm';

import VMScratchBlocks from '../../lib/blocks';
import styles from './flyout-resize-handle.css';

const MIN_WORKSPACE_WIDTH = 64;

const FlyoutResizeHandle = ({isVisible, vm}) => {
    const handleRef = useRef(null);

    useEffect(() => {
        if (!isVisible || !handleRef.current) return undefined;

        const handle = handleRef.current;
        const wrapper = handle.parentElement;
        const ScratchBlocks = VMScratchBlocks(vm);
        const workspace = ScratchBlocks.getMainWorkspace();
        const flyout = workspace && workspace.getFlyout();
        if (!flyout || typeof flyout.reflowInternal_ !== 'function') return undefined;

        let userWidth = null;
        let naturalWidth = flyout.getWidth();
        let activePointer = null;
        let startX = 0;
        let startWidth = 0;

        const updateHandlePosition = () => {
            if (!wrapper || !flyout.svgGroup_) return;
            const wrapperRect = wrapper.getBoundingClientRect();
            const flyoutRect = flyout.svgGroup_.getBoundingClientRect();
            if (!flyoutRect.width) return;
            handle.setAttribute('aria-valuenow', Math.round(flyoutRect.width));
            handle.style.visibility = 'visible';
            if (window.getComputedStyle(wrapper).direction === 'rtl') {
                handle.style.left = 'auto';
                handle.style.right = `${Math.max(0, wrapperRect.right - flyoutRect.left - 5)}px`;
            } else {
                handle.style.right = 'auto';
                handle.style.left = `${Math.max(0, flyoutRect.right - wrapperRect.left - 5)}px`;
            }
        };

        const originalReflow = flyout.reflowInternal_;
        flyout.reflowInternal_ = function (...args) {
            const result = originalReflow.apply(this, args);
            naturalWidth = this.getWidth();
            if (userWidth !== null) {
                this.width_ = Math.max(naturalWidth, userWidth);
                this.position();
                if (workspace.resizeContents) workspace.resizeContents();
                if (workspace.recordDragTargets) workspace.recordDragTargets();
            }
            updateHandlePosition();
            return result;
        };

        const resizeFlyout = width => {
            const wrapperRect = wrapper.getBoundingClientRect();
            const toolbox = wrapper.querySelector('.blocklyToolbox');
            const toolboxWidth = toolbox ? toolbox.getBoundingClientRect().width : 0;
            const scale = workspace.scale || 1;
            const maximum = Math.max(naturalWidth, (wrapperRect.width - toolboxWidth - MIN_WORKSPACE_WIDTH) / scale);
            userWidth = Math.min(maximum, Math.max(naturalWidth, width));
            flyout.width_ = userWidth;
            flyout.position();
            if (workspace.resizeContents) workspace.resizeContents();
            if (workspace.recordDragTargets) workspace.recordDragTargets();
            updateHandlePosition();
            wrapper.dispatchEvent(new Event('blocoslab:flyout-resize'));
        };

        const onPointerMove = event => {
            if (activePointer !== event.pointerId) return;
            const direction = window.getComputedStyle(wrapper).direction === 'rtl' ? -1 : 1;
            resizeFlyout(startWidth + ((event.clientX - startX) * direction) / (workspace.scale || 1));
        };

        const onPointerUp = event => {
            if (activePointer !== event.pointerId) return;
            activePointer = null;
            handle.classList.remove(styles.dragging);
            if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };

        const onPointerDown = event => {
            if (event.button !== 0) return;
            activePointer = event.pointerId;
            startX = event.clientX;
            startWidth = flyout.getWidth();
            handle.setPointerCapture(event.pointerId);
            handle.classList.add(styles.dragging);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerUp);
            event.preventDefault();
        };

        const onKeyDown = event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            const direction = window.getComputedStyle(wrapper).direction === 'rtl' ? -1 : 1;
            resizeFlyout(flyout.getWidth() + ((event.key === 'ArrowRight' ? 16 : -16) * direction) / (workspace.scale || 1));
            event.preventDefault();
        };

        handle.addEventListener('pointerdown', onPointerDown);
        handle.addEventListener('keydown', onKeyDown);
        const onViewportResize = () => {
            if (userWidth !== null) resizeFlyout(userWidth);
            else updateHandlePosition();
        };
        window.addEventListener('resize', onViewportResize);
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateHandlePosition);
        if (observer) observer.observe(wrapper);
        updateHandlePosition();

        return () => {
            handle.removeEventListener('pointerdown', onPointerDown);
            handle.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', onViewportResize);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            if (observer) observer.disconnect();
            if (flyout.reflowInternal_ !== originalReflow) flyout.reflowInternal_ = originalReflow;
        };
    }, [isVisible, vm]);

    if (!isVisible) return null;

    return (
        <div
            ref={handleRef}
            className={styles.handle}
            role="separator"
            aria-orientation="vertical"
            aria-label="Arraste para ajustar a largura da paleta de blocos"
            aria-valuemin={0}
            aria-valuenow={0}
            style={{visibility: 'hidden'}}
            tabIndex="0"
        />
    );
};

FlyoutResizeHandle.propTypes = {
    isVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default FlyoutResizeHandle;
