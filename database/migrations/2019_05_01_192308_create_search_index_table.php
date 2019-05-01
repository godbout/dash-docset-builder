<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSearchIndexTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('searchIndex', function (Blueprint $table) {
            $table->integer('id');
            $table->text('name');
            $table->text('type');
            $table->text('path');

            $table->primary('id');
            $table->unique(['name', 'type', 'path'], 'anchor');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('searchIndex');
    }
}
