import {
	Vector2
} from "../lib/three.module.js";

var SelectionHelper = ( function () {

	function SelectionHelper( selectionBox, renderer, cssClassName ) {

		this.element = document.createElement( 'div' );
		this.element.classList.add( cssClassName );
		this.element.style.pointerEvents = 'none';

		this.renderer = renderer;

		this.startPoint = new Vector2();
		this.endPoint = new Vector2();

		this.scene_start_point = new Vector2();
		this.scene_end_point = new Vector2();
    
		this.pointTopLeft = new Vector2();
		this.pointBottomRight = new Vector2();

		this.isDown = false;
        this.enabled = false;

		this.renderer.domElement.addEventListener( 'pointerdown', function ( event ) {

			this.isDown = true;
            if( this.enabled ) {
			    this.onSelectStart( event );
            }

		}.bind( this ), false );

		this.renderer.domElement.addEventListener( 'pointermove', function ( event ) {

			if ( this.isDown && this.enabled ) {

				this.onSelectMove( event );

			}

		}.bind( this ), false );

		this.renderer.domElement.addEventListener( 'pointerup', function ( event ) {

			this.isDown = false;
            if( this.enabled ) {
                this.onSelectOver( event );
            }

		}.bind( this ), false );

	}

	SelectionHelper.prototype.onSelectStart = function ( event ) {

		this.renderer.domElement.parentElement.appendChild( this.element );

		this.element.style.left = event.clientX + 'px';
		this.element.style.top = event.clientY + 'px';
		this.element.style.width = '0px';
		this.element.style.height = '0px';

		this.startPoint.x = event.clientX;
		this.startPoint.y = event.clientY;

        this.scene_start_point.x = ( event.clientX/ window.innerWidth ) * 2 - 1;
        this.scene_start_point.y = - ( event.clientY/ window.innerHeight) * 2 + 1;

	};

	SelectionHelper.prototype.onSelectMove = function ( event ) {

		this.pointBottomRight.x = Math.max( this.startPoint.x, event.clientX );
		this.pointBottomRight.y = Math.max( this.startPoint.y, event.clientY );
		this.pointTopLeft.x = Math.min( this.startPoint.x, event.clientX );
		this.pointTopLeft.y = Math.min( this.startPoint.y, event.clientY );

		this.element.style.left = this.pointTopLeft.x + 'px';
		this.element.style.top = this.pointTopLeft.y + 'px';
		this.element.style.width = ( this.pointBottomRight.x - this.pointTopLeft.x ) + 'px';
		this.element.style.height = ( this.pointBottomRight.y - this.pointTopLeft.y ) + 'px';

        this.scene_end_point.x = ( event.clientX/ window.innerWidth ) * 2 - 1;
        this.scene_end_point.y = - ( event.clientY/ window.innerHeight) * 2 + 1;
	};

	SelectionHelper.prototype.onSelectOver = function () {
		this.endPoint.x = event.clientX;
		this.endPoint.y = event.clientY;

        this.scene_end_point.x = ( event.clientX/ window.innerWidth ) * 2 - 1;
        this.scene_end_point.y = - ( event.clientY/ window.innerHeight) * 2 + 1;

		this.element.parentElement.removeChild( this.element );
        console.log(this.scene_end_point);

	};

	return SelectionHelper;

} )();

export { SelectionHelper };
